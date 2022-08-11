
module.exports = {
	addPagination : (entity, offset, limit, options) => {
		const {maxItems, maxPage = 100, maxItemsPerPage = 20} = options		

		let newPagination = {
			"firstPage": `/${entity}?page=1`,
			"previousPage": `/${entity}?page=1`,
			"currentPage": `/${entity}?page=1`,
			"nextPage": `/${entity}?page=1`,
			"lastPage": `/${entity}?page=1`,
			"maxPages": maxPage,
			"maxItems" : length,
			"maxItemsPerPage": maxItemsPerPage
		}
		
		let pagination = {
			first: {
				offset: '',
				limit: limit
			},
			next: {
				offset: '',
				limit: limit
			},
			last: {
				offset: '',
				limit: limit
			},
		}
			pagination.first.offset = offset;
			pagination.next.offset = offset + limit;
			pagination.last.offset = Math.floor((length - offset) / limit) * limit + offset
		
			return pagination
	}
}