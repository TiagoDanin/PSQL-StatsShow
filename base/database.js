const pg = require('pg').native
class Database {
	constructor(options) {
		console.log(options.database) 
		const pool = new pg.Pool({
			database: options.database
		})
		this.pool = pool
	}

	async mostUsed() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT calls AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}

	async mostRows() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT rows AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}

	async maxTime() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT max_time AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}

	async minTime() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT min_time AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 ASC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}

	async meanTime() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT mean_time AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}

	async localRead() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT local_blks_read AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}

	async localWrite() {
		const client = await this.pool.connect()
		const data = await client.query(`
			SELECT local_blks_written AS qt, query
			FROM pg_stat_statements
			ORDER BY 1 DESC
			LIMIT 10;
		`, []).catch(console.error)
		client.release()
		return data.rows
	}
}

module.exports = Database