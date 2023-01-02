import {getPrisma} from "../db/getPrisma";

export async function verifyAuthToken(token: string): Promise<string | undefined> {
	const storedToken = await getPrisma().accessToken.findUnique({
		where: {
			token,
		},
		include: {
			MachineUser: {
				select: {
					commonName: true
				}
			}
		}
	})

	return storedToken && !storedToken.revoked ? storedToken.MachineUser.commonName : undefined;
}