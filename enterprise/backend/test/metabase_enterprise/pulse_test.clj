(ns metabase-enterprise.pulse-test
  (:require
   [clojure.test :refer :all]
   [metabase-enterprise.pulse :as pulse]
   [metabase.public-settings.premium-features :as premium-features]))

(deftest parameters-test
  (is (= [{:id "1" :v "a"}
          {:id "2" :v "b"}
          {:id "3" :v "yes"}]
         (with-redefs [#_{:clj-kondo/ignore [:deprecated-var]} premium-features/enable-enhancements? (constantly true)]
           (pulse/the-parameters
            {:parameters [{:id "1" :v "a"} {:id "2" :v "b"}]}
            {:parameters [{:id "1" :v "no, since it's trumped by the pulse"} {:id "3" :v "yes"}]})))))
