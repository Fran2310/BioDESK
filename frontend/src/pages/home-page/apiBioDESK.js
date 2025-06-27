import axios from 'axios'

export async function fetchRoles() {
  const response = await axios.get('https://biodesk.onrender.com/api/docs#/Role/RoleController_getAllRoles')
  return response.data // Adjust if the data is nested
}
