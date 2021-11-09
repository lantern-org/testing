class CreatePhones < ActiveRecord::Migration[6.1]
  def change
    create_table :phones do |t|
      t.string :d_id
      t.integer :port
      t.string :health
      t.string :status
      t.boolean :selected
      t.string :route

      t.timestamps
    end
  end
end
