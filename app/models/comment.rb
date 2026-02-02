class Comment < ApplicationRecord
  belongs_to :post, counter_cache: true
  belongs_to :user

  validates :body, presence: true, length: { maximum: 500 }
  
end
