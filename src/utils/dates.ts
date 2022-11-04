export const nowISO = () => new Date().toISOString();

export const ISOToHuman = (iso: string) => new Date(iso).toDateString();
