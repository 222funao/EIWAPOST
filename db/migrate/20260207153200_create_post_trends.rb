class CreatePostTrends < ActiveRecord::Migration[8.1]
  def change
    create_table :post_trends do |t|
      t.references :post, null: false, foreign_key: true
      t.references :trend, null: false, foreign_key: true

      t.timestamps
    end

    add_index :post_trends, [:post_id, :trend_id], unique: true
  end
end
