import { ref } from "@vue/runtime-dom";
import type { NewExam } from "../types";

const propertiesPairs = ref<{ key: string; value: string }[]>([])
    
export function pairsFromProperties(obj: any) {
    if (!obj || typeof obj !== 'object') return []
    return Object.entries(obj).map(([key, value]) => ({
        key,
        value: typeof value === 'object' ? JSON.stringify(value) : String(value),
    }))
}

export function propertiesFromPairs() {
    const obj: Record<string, any> = {}
    for (const { key, value } of propertiesPairs.value) {
        if (key.trim()) obj[key.trim()] = value
    }
    return Object.keys(obj).length ? obj : undefined
}


export function getEmptyExam(): NewExam {
    return {
        name: '',
        description: '',
        suppliesText: '',
        price: 0,
        propertiesText: ''
    };
}