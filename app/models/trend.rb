class Trend < ApplicationRecord
  has_many :post_trends, dependent: :destroy
  has_many :posts, through: :post_trends

  validates :name, presence: true, uniqueness: true

  scope :top_with_post_counts, lambda { |size = 5|
    joins(:post_trends)
      .select("trends.*, COUNT(post_trends.id) AS posts_count")
      .group("trends.id")
      .order(Arel.sql("COUNT(post_trends.id) DESC"), name: :asc)
      .limit(size)
  }

  def posts_count
    self[:posts_count].to_i
  end
end
