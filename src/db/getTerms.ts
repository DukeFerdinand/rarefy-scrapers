import {getPrisma} from "./getPrisma";

export const getSearchTerms = async () => {
    return await getPrisma().savedSearch.findMany({});
}

export const getResultToProcess = async (id: string) => {
    return await getPrisma().searchResult.findUnique({
        where: {
            id,
        }
    });
}
