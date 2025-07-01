// src/services/api/apiDPT.ts
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_URL_APISEGEN_PROD;
// Token de acceso a API externa
const USERNAME = import.meta.env.VITE_CREDENTIAL_APISEGEN_USER;
const PW = import.meta.env.VITE_CREDENTIAL_APISEGEN_PW;

let token: string | null = null;

/**
 * Realiza una solicitud de inicio de sesión al servicio DPT usando las credenciales proporcionadas.
 *
 * @param usuario - Nombre de usuario para autenticación.
 * @param clave - Contraseña del usuario.
 * @returns Una promesa que resuelve con el token de autenticación recibido.
 */
export const loginApiDPT = async () => {
  const url = `${BASE_URL}/login`;

  const params = new URLSearchParams();
  params.append('usuario', USERNAME);
  params.append('clave', PW);

  const { data } = await axios.post(url, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  token = data.token;
  return token;
};

export const getCurrentToken = () => token;

/**
 * Obtiene la lista de entidades desde la API DPT y la transforma en un arreglo de objetos
 * con propiedades 'label' y 'value' para su uso en selectores.
 * Lanza un error si no existe un token de autenticación.
 * @returns {Promise<Array<{label: string, value: string}>>} Lista de entidades formateadas.
 */
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

/**
 * Obtiene la lista de municipios asociados a una entidad específica.
 *
 * @param codEntidad - Código de la entidad para filtrar los municipios.
 * @returns Promesa que resuelve a un array de objetos con las propiedades 'label' y 'value' de cada municipio.
 * @throws Error si no existe un token de autenticación válido.
 */
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

/**
 * Obtiene el listado de parroquias para una entidad y municipio dados.
 *
 * @param codEntidad - Código de la entidad.
 * @param codMunicipio - Código del municipio.
 * @returns Promesa que resuelve a un array de objetos con las propiedades 'label' y 'value' de cada parroquia.
 * @throws Error si no existe un token de autenticación.
 */
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

/**
 * Obtiene el listado de comunidades según los códigos de entidad, municipio y parroquia proporcionados.
 * Lanza un error si no hay token de autenticación.
 * Devuelve un arreglo de objetos con las propiedades 'label' y 'value' para cada comunidad.
 *
 * @param codEntidad - Código de la entidad.
 * @param codMunicipio - Código del municipio.
 * @param codParroquia - Código de la parroquia.
 * @returns Promesa que resuelve a un arreglo de comunidades formateadas.
 */
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
