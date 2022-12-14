(ns metabase.domain-entities.specs-test
  (:require
   [clojure.test :refer :all]
   [metabase.domain-entities.specs :as de.specs]
   [schema.core :as s]))

(deftest validate-specs-test
  (testing "All specs should be valid YAML (the parser will raise an exception if not) and conforming to the schema."
    (doseq [[spec-name spec] @de.specs/domain-entity-specs]
      (testing spec-name
        (is (not (s/check de.specs/DomainEntitySpec spec)))))))
