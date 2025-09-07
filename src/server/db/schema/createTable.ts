import { pgTableCreator } from "drizzle-orm/pg-core";
const createTable = pgTableCreator((name) => `cs-uil-website_${name}`);

export default createTable;
