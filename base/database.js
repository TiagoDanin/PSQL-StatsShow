const pg = require('pg').native
class Database {
	constructor(options) {
		console.log(options.database)
		const pool = new pg.Pool({
			database: options.database
		})
		this.pool = pool
	}

	async get(query, parameters) {
		const client = await this.pool.connect()
		const data = await client.query(query, parameters).catch(error => {
			console.error(error)
			return {
				rows: {
					error
				}
			}
		})
		client.release()
		return data.rows
	}

	async mostUsed() {
		return this.get(`
			SELECT calls AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, [])
	}

	async mostRows() {
		return this.get(`
			SELECT rows AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, [])
	}

	async maxTime() {
		return this.get(`
			SELECT max_time AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, [])
	}

	async minTime() {
		return this.get(`
			SELECT min_time AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 ASC
			LIMIT 10;
		`, [])
	}

	async meanTime() {
		return this.get(`
			SELECT mean_time AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, [])
	}

	async localRead() {
		return this.get(`
			SELECT local_blks_read AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, [])
	}

	async localWrite() {
		return this.get(`
			SELECT local_blks_written AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, [])
	}
}

module.exports = Database
