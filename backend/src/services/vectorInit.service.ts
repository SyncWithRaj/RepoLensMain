import { QdrantClient } from "@qdrant/js-client-rest";

const COLLECTION = "repo_entities"

export class VectorInitService {

    private client: QdrantClient;

    constructor() {
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL || "http://localhost:6333"
        })
    }

    async initVectorCollection() {
        const collections = await this.client.getCollections();

        const exists = collections.collections.find(
            (c) => c.name === COLLECTION
        )

        if (exists) {
            return {
                message: "Collection already exists"
            }
        }

        await this.client.createCollection(COLLECTION, {
            vectors: {
                size: 3072,
                distance: "Cosine"
            }
        });

        return {
            message: "repo_entities collection created"
        }
    }
}