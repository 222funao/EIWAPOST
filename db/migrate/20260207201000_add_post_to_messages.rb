class AddPostToMessages < ActiveRecord::Migration[8.1]
  def change
    add_reference :messages, :post, null: true, foreign_key: { on_delete: :nullify }
  end
end
