import fs from 'fs/promises';

export const deleteImages = async (frontPath: string, backPath: string): Promise<void> => {
  try {
    await Promise.allSettled([
      fs.unlink(frontPath),
      fs.unlink(backPath)
    ]);
    console.log("Temporary images deleted successfully.");
  } catch (error) {
    console.warn("Error while deleting images:", error);
  }
};
