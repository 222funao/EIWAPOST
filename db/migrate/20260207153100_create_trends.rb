class CreateTrends < ActiveRecord::Migration[8.1]
  def change
    create_table :trends do |t|
      t.string :name, null: false

      t.timestamps
    end

    add_index :trends, :name, unique: true
  end
end
