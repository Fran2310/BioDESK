export function generateLabDbUrl(baseUrl: string, dbName: string): string {
    const url = new URL(baseUrl);
    url.pathname = `${url.pathname.replace(/\/$/, '')}/${dbName}`;
    return url.toString()
}