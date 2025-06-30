// src/services/api/apiDPT.ts

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL_APISEGEN_PROD;
let token: string | null = null;

export const loginApiDPT = async (usuario: string, clave: string) => {
  const url = `${BASE_URL}/login`;

  // Formatear los datos como x-www-form-urlencoded
  const params = new URLSearchParams();
  params.append('usuario', usuario);
  params.append('clave', clave);

  const { data } = await axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  token = data.token;
  return token;
};

export const getCurrentToken = () => token;

export const fetchEntidades = async () => {
  if (!token) throw new Error('Fallo login apiDPT');
  const { data } = await axios.get(`${BASE_URL}/listadoEntidad`, {
    params: { token },
  });
  return data.data.map((item: any) => ({
    label: item.entidad_ine,
    value: item.cod_entidad_ine,
  }));
};

export const fetchMunicipios = async (codEntidad: string) => {
  if (!token) throw new Error('Fallo login apiDPT');
  const { data } = await axios.get(`${BASE_URL}/listadoMunicipio`, {
    params: { token, codEntidad },
  });
  return data.data.map((item: any) => ({
    label: item.municipio_ine,
    value: item.cod_municipio_ine,
  }));
};

export const fetchParroquias = async (
  codEntidad: string,
  codMunicipio: string
) => {
  if (!token) throw new Error('Fallo login apiDPT');
  const { data } = await axios.get(`${BASE_URL}/listadoParroquia`, {
    params: { token, codEntidad, codMunicipio },
  });

  return data.data.map((item: any) => ({
    label: item.parroquia_ine,
    value: item.cod_parroquia_ine,
  }));
};

export const fetchComunidades = async (
  codEntidad: string,
  codMunicipio: string,
  codParroquia: string
) => {
  if (!token) throw new Error('Fallo login apiDPT');
  const { data } = await axios.get(`${BASE_URL}/listadoComunidad`, {
    params: { token, codEntidad, codMunicipio, codParroquia },
  });
  return data.data.map((item: any) => ({
    label: item.nombre_comunidad,
    value: item.id_comunidad_ine,
  }));
};
