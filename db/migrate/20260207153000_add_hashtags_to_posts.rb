class AddHashtagsToPosts < ActiveRecord::Migration[8.1]
  def change
    add_column :posts, :hashtags, :string
  end
end
