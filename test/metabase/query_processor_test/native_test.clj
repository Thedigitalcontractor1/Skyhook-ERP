(ns metabase.query-processor-test.native-test
  (:require
   [clojure.test :refer :all]
   [metabase.query-processor :as qp]
   [metabase.query-processor-test :as qp.test]
   [metabase.test :as mt]))

(deftest native-test
  (is (= {:rows
          [["Plato Yeshua"]
           ["Felipinho Asklepios"]
           ["Kaneonuskatew Eiran"]
           ["Simcha Yan"]
           ["Quentin Sören"]
           ["Shad Ferdynand"]
           ["Conchúr Tihomir"]
           ["Szymon Theutrich"]
           ["Nils Gotam"]
           ["Frans Hevel"]
           ["Spiros Teofil"]
           ["Kfir Caj"]
           ["Dwight Gresham"]
           ["Broen Olujimi"]
           ["Rüstem Hebel"]]
          :cols
          [{:display_name "NAME"
            :source       :native
            :field_ref    [:field "NAME" {:base-type :type/Text}]
            :name         "NAME"
            :base_type    :type/Text
            :effective_type :type/Text}]}
         (qp.test/rows-and-cols
          (qp/process-query
           (mt/native-query
            {:query "select name from users;"}))))))
