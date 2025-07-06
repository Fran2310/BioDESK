import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { AgeGroup, Gender } from '@prisma/client-lab';
import { LabService } from 'src/lab/services/lab.service';
import { LabDbManageService } from 'src/prisma-manager/lab-prisma/services/lab-db-manage.service';
import { SystemUserService } from 'src/user/system-user/system-user.service';

@Injectable()
export class DataTestReport {
  private readonly logger = new Logger(DataTestReport.name);

  constructor(
    private readonly systemUserService: SystemUserService,
    private readonly labService: LabService,
    private readonly labDbManageService: LabDbManageService,
  ) {}

  async getData( // TODO Esta función se podría pasar al PdfService o a un submodulo para eso
    labId: number,
    requestMedicTestId: number,
  ): Promise<any> {
    try {
      // --- 1. OBTENCIÓN DE DATOS CRUDOS ---
      const labPrisma = await this.labDbManageService.genInstanceLabDB(labId);
      
      const [lab, requestWithRelations] = await Promise.all([
        this.labService.getLabById(labId),
        labPrisma.requestMedicTest.findUnique({
          where: { id: requestMedicTestId, state: 'COMPLETED' },
          include: {
            medicHistory: { include: { patient: true } },
            medicTestCatalog: { include: { properties: { include: { valueReferences: true } } } },
            byLabUser: true
          },
        }),
      ]);

      
      
      if (!requestWithRelations) {
        throw new NotFoundException(`Examen médico completado con ID ${requestMedicTestId} no fue encontrado.`);
      }

      const systemUser = await this.systemUserService.getSystemUser({ uuid: requestWithRelations?.byLabUser?.systemUserUuid });

      // --- 2. EXTRACCIÓN Y CÁLCULOS (CON MANEJO DE NULOS) ---

      const patient = requestWithRelations.medicHistory.patient;
      if (!patient) {
        throw new NotFoundException(`No se encontró el paciente asociado a la solicitud de examen.`);
      }

      // Declaramos las variables que pueden depender de la fecha de nacimiento
      let patientAge: number | null = null;
      let patientAgeGroup: AgeGroup = AgeGroup.ANY; // Default a 'ANY' para máxima compatibilidad

      // **CAMBIO CLAVE 1: Manejo de birthDate nulo**
      // Solo calculamos la edad si la fecha de nacimiento existe
      if (patient.birthDate) {
        patientAge = this.calculateAge(patient.birthDate);
        // Solo asignamos un grupo específico si la edad fue calculada
        if (patientAge !== null) {
            patientAgeGroup = patientAge >= 18 ? AgeGroup.ADULT : AgeGroup.CHILD;
        }
      }
      
      // --- 3. PROCESAMIENTO DE RESULTADOS (CON MANEJO DE NULOS) ---

      const results = requestWithRelations.medicTestCatalog.properties.map((prop) => {
        // **CAMBIO CLAVE 2: Manejo de resultProperties nulo**
        // Usamos el operador de encadenamiento opcional (?.) para evitar errores si resultProperties es null.
        // Si es null o la propiedad específica no existe, usamos 'N/A'.
        const resultValue = requestWithRelations.resultProperties?.[prop.name] ?? 'N/A';
        
        const referenceRange = this.findReferenceRange(
          prop.valueReferences,
          patient.gender,
          patientAgeGroup, // Usamos el ageGroup calculado (o el default 'ANY')
        );

        return {
          propertyName: prop.name,
          value: resultValue,
          unit: prop.unit ?? '',
          referenceRange,
        };
      });

      // --- 4. CONSTRUCCIÓN DEL OBJETO FINAL PARA LA PLANTILLA ---

      const reportData = {
        systemUser: {
          fullName: `${systemUser.name} ${systemUser.lastName}`,
          email: systemUser.email,
        },
        lab: {
          name: lab.name,
          rif: lab.rif,
          dir: lab.dir,
          phoneNums: lab.phoneNums,
          logoPath: lab.logoPath,
        },
        patient: {
          fullName: `${patient.name} ${patient.lastName}`,
          ci: this.formatCi(patient.ci),
          // Mostramos la edad o un texto alternativo si no se pudo calcular
          age: patientAge !== null ? `${patientAge} años` : 'No especificada',
          gender: patient.gender,
          email: patient.email,
        },
        request: {
          id: this.formatRequestId(requestWithRelations.id),
          // Agregamos una verificación para completedAt
          completedAtFormatted: requestWithRelations.completedAt
            ? requestWithRelations.completedAt.toLocaleDateString('es-VE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Pendiente', // O el texto que prefieras si es null
          medicTestName: requestWithRelations.medicTestCatalog.name,
          observation: requestWithRelations.observation,
        },
        results,
      };

      return reportData;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al generar los datos del reporte: ${error.message}`, error.stack);
      throw new InternalServerErrorException(`Ocurrió un error inesperado al procesar la solicitud del reporte.`);
    }
  }

  // --- Helpers ---
    private calculateAge(birthDate: Date | null): number | null {
      // Si la fecha es nula, devolvemos null inmediatamente.
      if (!birthDate) return null;
      
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }

    private findReferenceRange(references: any[], gender: Gender, ageGroup: AgeGroup): string {
        const specificMatch = references.find(
          (ref) => ref.gender === gender && ref.ageGroup === ageGroup,
        );
        if (specificMatch) return specificMatch.range;

        const anyGenderMatch = references.find(
          (ref) => ref.gender === Gender.ANY && ref.ageGroup === ageGroup,
        );
        if (anyGenderMatch) return anyGenderMatch.range;
        
        const anyAgeMatch = references.find(
          (ref) => ref.gender === gender && ref.ageGroup === AgeGroup.ANY,
        );
        if (anyAgeMatch) return anyAgeMatch.range;

        const fallback = references.find(
          (ref) => ref.gender === Gender.ANY && ref.ageGroup === AgeGroup.ANY,
        );
        return fallback ? fallback.range : 'No disponible';
    }

    private formatRequestId(id: number): string {
      return id.toString().padStart(6, '0');
    }

    private formatCi(ci: string | number): string {
      const ciStr = ci.toString();
      const visible = ciStr.slice(1); 
      return `V-${visible}`; // TODO Puedes ajustar si tienes nacionalidad en el modelo
    }
}