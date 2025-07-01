-- Paso 1: Crear columnas temporales con sufijo
ALTER TABLE "MedicHistory" 
ADD COLUMN "allergies_temp" TEXT[] DEFAULT '{}',
ADD COLUMN "pathologies_temp" TEXT[] DEFAULT '{}';

-- Paso 2: Convertir y copiar datos
UPDATE "MedicHistory" SET
  "allergies_temp" = CASE 
    WHEN "allergies" IS NULL THEN '{}' 
    ELSE ARRAY["allergies"] 
  END,
  "pathologies_temp" = CASE 
    WHEN "pathologies" IS NULL THEN '{}' 
    ELSE ARRAY["pathologies"] 
  END;

-- Paso 3: Eliminar las columnas originales
ALTER TABLE "MedicHistory" 
DROP COLUMN "allergies",
DROP COLUMN "pathologies";

-- Paso 4: Volver a crear las columnas con el nombre original y tipo array
ALTER TABLE "MedicHistory" 
ADD COLUMN "allergies" TEXT[] DEFAULT '{}',
ADD COLUMN "pathologies" TEXT[] DEFAULT '{}';

-- Paso 5: Copiar los datos convertidos
UPDATE "MedicHistory" SET
  "allergies" = "allergies_temp",
  "pathologies" = "pathologies_temp";

-- Paso 6: Eliminar las columnas temporales
ALTER TABLE "MedicHistory" 
DROP COLUMN "allergies_temp",
DROP COLUMN "pathologies_temp";