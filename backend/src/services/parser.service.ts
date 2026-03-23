import { CodeEntity } from "../models/codeEntity.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { FileMetadata } from "../models/fileMetadata.model.js";

import { parseRepository } from "../modules/parser/astParser.js";

export async function processRepositoryParsing(
  repoId: string,
  filePaths: string[]
) {

  const { entities, relationships, fileMetadata } =
    await parseRepository(repoId, filePaths);


  // nothing parsed
  if (!entities.length && !fileMetadata.length) {
    return {
      message: "Nothing parsed",
      totalEntities: 0,
      totalRelationships: 0,
      totalFiles: 0
    };
  }


  // 🔥 insert entities
  if (entities.length) {
    await CodeEntity.insertMany(entities, { ordered: false });
  }


  // 🔥 insert relationships
  if (relationships.length) {
    await CodeRelationship.insertMany(relationships, { ordered: false });
  }


  // 🔥 insert file metadata
  if (fileMetadata.length) {
    await FileMetadata.insertMany(fileMetadata, { ordered: false });
  }


  // ---------- Route → Handler mapping ----------

  const routes = entities.filter(e => e.type === "route");

  const functions = entities.filter(
    e =>
      e.type === "function" ||
      e.type === "method" ||
      e.type === "arrow"
  );

  const routeRelationships = [];

  for (const route of routes) {

    const handler = route.name;

    const target = functions.find(f => f.name === handler);

    if (!target) continue;

    routeRelationships.push({
      repoId,
      fromName: route.name,
      fromFilePath: route.filePath,
      toName: target.name,
      toFilePath: target.filePath,
      relationType: "handles",
      line: route.startLine
    });
  }


  if (routeRelationships.length) {
    await CodeRelationship.insertMany(routeRelationships, { ordered: false });
  }


  return {
    message: "Parsing completed",
    totalEntities: entities.length,
    totalRelationships: relationships.length + routeRelationships.length,
    totalFiles: fileMetadata.length
  };
}