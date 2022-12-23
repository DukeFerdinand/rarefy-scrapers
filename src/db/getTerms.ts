import {prisma} from "./getPrisma";

export const getSearchTerms = async () => {
    return await prisma.savedSearch.findMany({});
}
