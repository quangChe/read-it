import { __prod__ } from "./constants";
import { MikroORM } from "@mikro-orm/core";
import path from 'path';
import { Post } from "./entities/Post";
import { User } from "./entities/User";

export default {
	entities: [Post, User],
	dbName: 'readdit',
	debug: !__prod__,
	type: 'postgresql',
	migrations: {
		path: path.join(__dirname, "./migrations"),
		pattern: /^[\w-]+\d+\.[tj]s$/
	}
} as Parameters<typeof MikroORM.init>[0];