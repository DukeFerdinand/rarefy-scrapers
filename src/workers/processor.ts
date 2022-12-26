import {parentPort} from "worker_threads";
import {processJobConsumer} from "../queue";

parentPort?.postMessage("starting processor worker");

processJobConsumer.process(async (job) => {
	try {
		parentPort?.postMessage(`handling job ${job.id}`);

		job.emit('complete', 'TEMP RESPONSE! :^)');

		parentPort?.postMessage(`job ${job.id} completed`);
	} catch (e) {
		job.emit("failed", e);
		parentPort?.emit("error", e);
	}
});
