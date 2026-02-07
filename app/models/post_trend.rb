class PostTrend < ApplicationRecord
  belongs_to :post
  belongs_to :trend

  validates :post_id, uniqueness: { scope: :trend_id }
end
