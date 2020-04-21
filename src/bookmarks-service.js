const BookmarksService = {
    getAllBookmarks(knex){
      return knex.select('*').from('bookmarks_list')
    },
    getById(knex, id){
        return knex.select('*').from('bookmarks_list').where('id', id).first()
    },
    deleteBookmark(knex, id){
      return knex('bookmarks_list')
      .where({id})
      .delete()
    },
    postBookmark(knex, article){
      return knex
      .insert(article)
      .into('bookmarks_list')
      .returning('*')
      .then(rows=> {
        return rows[0]
      })
    },
    patchBookmark(knex, id, update){
      return knex('bookmarks_list')
      .where({id})
      .update(update)
    }
}

module.exports = BookmarksService