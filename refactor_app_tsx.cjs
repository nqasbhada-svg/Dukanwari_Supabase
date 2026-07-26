const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove safeLoadFromLocalStorage usages in state initialization
appTsx = appTsx.replace(/const \[currentView, setCurrentView\] = useState<string>\(\(\) => \{[\s\S]*?\}\);/, `const [currentView, setCurrentView] = useState<string>('dashboard');`);
appTsx = appTsx.replace(/const \[session, setSession\] = useState<UserSession \| null>\(\(\) => \{[\s\S]*?\}\);/, `const [session, setSession] = useState<UserSession | null>(null);`);
appTsx = appTsx.replace(/const \[registrations, setRegistrations\] = useState<ShopRegistration\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [registrations, setRegistrations] = useState<ShopRegistration[]>([]);`);
appTsx = appTsx.replace(/const \[products, setProducts\] = useState<Product\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [products, setProducts] = useState<Product[]>([]);`);
appTsx = appTsx.replace(/const \[customers, setCustomers\] = useState<Customer\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [customers, setCustomers] = useState<Customer[]>([]);`);
appTsx = appTsx.replace(/const \[suppliers, setSuppliers\] = useState<Supplier\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [suppliers, setSuppliers] = useState<Supplier[]>([]);`);
appTsx = appTsx.replace(/const \[invoices, setInvoices\] = useState<Invoice\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [invoices, setInvoices] = useState<Invoice[]>([]);`);
appTsx = appTsx.replace(/const \[purchaseHistory, setPurchaseHistory\] = useState<PurchaseBill\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [purchaseHistory, setPurchaseHistory] = useState<PurchaseBill[]>([]);`);
appTsx = appTsx.replace(/const \[expenses, setExpenses\] = useState<Expense\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [expenses, setExpenses] = useState<Expense[]>([]);`);
appTsx = appTsx.replace(/const \[auditLogs, setAuditLogs\] = useState<AuditLog\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);`);
appTsx = appTsx.replace(/const \[shopSettings, setShopSettings\] = useState<ShopSettings>\(\(\) => \{[\s\S]*?\}\);/, `const [shopSettings, setShopSettings] = useState<ShopSettings>(defaultSettings);`);
appTsx = appTsx.replace(/const \[categories, setCategories\] = useState<Category\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [categories, setCategories] = useState<Category[]>([]);`);
appTsx = appTsx.replace(/const \[brands, setBrands\] = useState<Brand\[\]>\(\(\) => \{[\s\S]*?\}\);/, `const [brands, setBrands] = useState<Brand[]>([]);`);

// 2. Remove localStorage useEffects
const localStorageRegex = /\/\/ Keep localStorage in sync with changes in state[\s\S]*?const handleAddCategory/m;
appTsx = appTsx.replace(localStorageRegex, `const handleAddCategory`);

// Fix handleAddCategory and handleAddBrand to not use localStorage
appTsx = appTsx.replace(/localStorage\.setItem\('vastraa_categories', JSON\.stringify\(updated\)\);/, '');
appTsx = appTsx.replace(/localStorage\.setItem\('vastraa_brands', JSON\.stringify\(updated\)\);/, '');

// 3. Remove Cloud SQL fallback in loadCloudData
const cloudSqlFallbackRegex = /\/\/ Fallback to Cloud SQL if Supabase not configured or failed[\s\S]*?finally \{/m;
appTsx = appTsx.replace(cloudSqlFallbackRegex, `} catch (err) {\n        console.warn('Failed to load initial data:', err);\n      } finally {`);

// 4. Remove all other fetch('/api/...') calls
// They are mostly wrapped in async blocks or `.then()`. Let's just remove the fetch calls and their error handling.
// Actually, they are inside functions like handleAddExpense, handleAddProduct, etc.
// Since the state is already updated locally in those functions and the debouncer will sync it, we can just strip the fetch blocks.
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\('\/api\/users\/sync'[\s\S]*?setSession\(\{/m, `setSession({`);

// Remove fetch from handleRegisterShop
appTsx = appTsx.replace(/try\s*\{\s*await\s*fetch\('\/api\/registrations',[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}\s*finally/m, `finally`);

// Remove fetch from handleApprovalAction
appTsx = appTsx.replace(/try\s*\{\s*const\s*res\s*=\s*await\s*fetch\(\`\/api\/registrations\/\$\{id\}\`,[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);

// Remove fetch from handleAddExpense
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\('\/api\/expenses',[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\(\`\/api\/expenses\/\$\{id\}\`,[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);

// Remove fetch from handleAddProduct
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\('\/api\/products',[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\(\`\/api\/products\/\$\{id\}\`,[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);

// Remove fetch from handleAddCustomer
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\('\/api\/customers',[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);

// Remove fetch from handleAddSupplier
appTsx = appTsx.replace(/try\s*\{\s*const\s*response\s*=\s*await\s*fetch\('\/api\/suppliers',[\s\S]*?\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}/m, ``);

// Remove fetch from handleGenerateInvoice
appTsx = appTsx.replace(/try\s*\{\s*await\s*fetch\('\/api\/invoices',[\s\S]*?catch\s*\(err\)\s*\{[\s\S]*?\}/m, `try {`); // keep try for the rest? Wait, there are multiple fetch inside
appTsx = appTsx.replace(/fetch\('\/api\/products', \{[\s\S]*?\}\);/g, ``);
appTsx = appTsx.replace(/fetch\('\/api\/customers', \{[\s\S]*?\}\);/g, ``);
appTsx = appTsx.replace(/fetch\('\/api\/suppliers', \{[\s\S]*?\}\);/g, ``);
appTsx = appTsx.replace(/await\s*fetch\('\/api\/invoices', \{[\s\S]*?\}\);/g, ``);
appTsx = appTsx.replace(/await\s*fetch\('\/api\/purchase-bills', \{[\s\S]*?\}\);/g, ``);

fs.writeFileSync('src/App.tsx', appTsx);
console.log('App.tsx refactored');
