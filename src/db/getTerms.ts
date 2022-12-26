import {prisma} from "./getPrisma";

export const getSearchTerms = async () => {
    return await prisma.savedSearch.findMany({});
}

export const getResultToProcess = async (id: string) => {
    return await prisma.searchResult.findUnique({
        where: {
            id,
        }
    });
}
