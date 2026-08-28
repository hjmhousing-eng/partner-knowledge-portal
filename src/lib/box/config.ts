export function isBoxConfigured(): boolean {
  return Boolean(
    process.env.BOX_CLIENT_ID &&
      process.env.BOX_CLIENT_SECRET &&
      process.env.BOX_ENTERPRISE_ID &&
      process.env.BOX_LIBRARY_FOLDER_ID,
  );
}

export function boxLibraryFolderId(): string {
  const id = process.env.BOX_LIBRARY_FOLDER_ID;
  if (!id) {
    throw new Error("BOX_LIBRARY_FOLDER_ID is not set");
  }
  return id;
}
