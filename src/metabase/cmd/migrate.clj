(ns metabase.cmd.migrate
  (:require
   [metabase.db.connection :as mdb.connection]
   [metabase.db.setup :as mdb.setup]))

(defn migrate!
  "Migrate the Metabase application DB."
  [direction]
  (mdb.setup/migrate! (mdb.connection/db-type) (mdb.connection/data-source) (keyword direction)))
