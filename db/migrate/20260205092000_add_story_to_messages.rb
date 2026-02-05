class AddStoryToMessages < ActiveRecord::Migration[8.1]
  def change
    add_reference :messages, :story, foreign_key: true
  end
end
