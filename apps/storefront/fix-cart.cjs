const fs = require('fs');
let content = fs.readFileSync('src/components/cart.tsx', 'utf8');
content = content.replace(/import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@\/components\/ui\/drawer"\n/g, 'import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer"\n');
content = content.replace(/, DrawerClose, /g, ', ');
content = content.replace(/import { Drawer, DrawerContent, DrawerHeader, DrawerTitle,  } from "@\/components\/ui\/drawer"\n/g, 'import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer"\n');
fs.writeFileSync('src/components/cart.tsx', content);
