import {getPrisma} from "../src/db/getPrisma";

const test = async () => {
	await getPrisma().machineUserPermission.create({
		data: {
			id: 'hmm',
			permission: 'READ'
		}
	})
}

test().then((res) => console.log(res))