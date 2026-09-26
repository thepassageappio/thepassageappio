import {test} from "node:test";
import assert from "node:assert/strict";
import {offeredPublishedFinancialPoaPermissions as offered, parsePublishedPermissionCatalog} from "./permission-catalog.ts";
test("published form fails closed on missing or wrong-kind data",()=>{
 assert.deepEqual(offered(null),[]);
 assert.deepEqual(offered(parsePublishedPermissionCatalog({organization_id:"org",authority_type_key:"trustee",pack_ready:true,items:[]})),[]);
});
