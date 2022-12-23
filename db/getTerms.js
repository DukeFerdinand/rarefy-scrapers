import {prisma} from "./getPrisma.js";

export const getSearchTerms = async () => {
    return await prisma.SearchTerm.findMany({});
}