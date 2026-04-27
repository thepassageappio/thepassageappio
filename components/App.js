05:19:36.085 Running build in Washington, D.C., USA (East) – iad1
05:19:36.086 Build machine configuration: 2 cores, 8 GB
05:19:36.215 Cloning github.com/thepassageappio/thepassageappio (Branch: main, Commit: d52a4ec)
05:19:36.609 Cloning completed: 394.000ms
05:19:36.983 Restored build cache from previous deployment (3CUUx2y1kMq7tfNMyBXBfz394X5k)
05:19:37.231 Running "vercel build"
05:19:37.955 Vercel CLI 51.6.1
05:19:38.216 Installing dependencies...
05:19:40.998 
05:19:40.998 up to date in 2s
05:19:40.999 
05:19:41.000 3 packages are looking for funding
05:19:41.000   run `npm fund` for details
05:19:41.031 Detected Next.js version: 14.0.0
05:19:41.034 Running "npm run build"
05:19:41.145 
05:19:41.146 > passage-app@1.0.0 build
05:19:41.146 > next build
05:19:41.146 
05:19:41.821    Linting and checking validity of types ...
05:19:41.947    ▲ Next.js 14.0.0
05:19:41.948 
05:19:41.948    Creating an optimized production build ...
05:19:42.887 Failed to compile.
05:19:42.887 
05:19:42.888 ./components/App.js
05:19:42.888 Error: 
05:19:42.889   [31mx[0m Expected ',', got 'onClick'
05:19:42.889       ,-[[36;1;4m/vercel/path0/components/App.js[0m:1329:1]
05:19:42.889  [2m1329[0m |                       </div>
05:19:42.889  [2m1330[0m |                     </div>
05:19:42.889  [2m1331[0m |                   </button>
05:19:42.890  [2m1332[0m |                   <button onClick={(e) => { e.stopPropagation(); handleArchive(wf.id); }}
05:19:42.890       : [31;1m                          ^^^^^^^[0m
05:19:42.890  [2m1333[0m |                     style={{ width: "100%", padding: "6px", fontSize: 11, color: C.soft, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "center", marginBottom: 4 }}>
05:19:42.890  [2m1334[0m |                     {archiving === wf.id ? "Archiving..." : "Archive plan"}
05:19:42.890  [2m1335[0m |                   </button>
05:19:42.891       `----
05:19:42.891 
05:19:42.891 Caused by:
05:19:42.891     Syntax Error
05:19:42.891 
05:19:42.891 Import trace for requested module:
05:19:42.891 ./components/App.js
05:19:42.892 ./pages/index.js
05:19:42.892 
05:19:42.892 
05:19:42.892 > Build failed because of webpack errors
05:19:42.916 Error: Command "npm run build" exited with 1
