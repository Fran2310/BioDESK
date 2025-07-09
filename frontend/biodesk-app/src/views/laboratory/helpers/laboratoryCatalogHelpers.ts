import { ref } from "@vue/runtime-dom";
import type { NewExam } from "../types";

// Estado reactivo para pares clave-valor de propiedades
const propertiesPairs = ref<{ key: string; value: string }[]>([])

// Convierte un objeto de propiedades a un array de pares clave-valor
export function pairsFromProperties(obj: any) {
    if (!obj || typeof obj !== 'object') return []
    return Object.entries(obj).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
}

// Convierte el array de pares clave-valor a un objeto de propiedades
export function propertiesFromPairs() {
    const obj: Record<string, any> = {}
    for (const { key, value } of propertiesPairs.value) {
        if (key.trim()) obj[key.trim()] = value
    }
    return Object.keys(obj).length ? obj : undefined
}

// Devuelve un examen vacío (estructura base)
export function getEmptyExam(): NewExam {
    return {
        name: '',
        description: '',
        suppliesText: '',
        price: 0,
        propertiesText: ''
    };
}