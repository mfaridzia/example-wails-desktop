export namespace main {
	
	export class DashboardMetrics {
	    totalRevenue: number;
	    totalOrders: number;
	    pendingSync: number;
	    topProduct: string;
	
	    static createFrom(source: any = {}) {
	        return new DashboardMetrics(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.totalRevenue = source["totalRevenue"];
	        this.totalOrders = source["totalOrders"];
	        this.pendingSync = source["pendingSync"];
	        this.topProduct = source["topProduct"];
	    }
	}
	export class OrderItem {
	    productId: string;
	    name: string;
	    price: number;
	    quantity: number;
	    subtotal: number;
	
	    static createFrom(source: any = {}) {
	        return new OrderItem(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.productId = source["productId"];
	        this.name = source["name"];
	        this.price = source["price"];
	        this.quantity = source["quantity"];
	        this.subtotal = source["subtotal"];
	    }
	}
	export class Order {
	    id: string;
	    orderNumber: string;
	    outletId: string;
	    customerName: string;
	    items: OrderItem[];
	    totalAmount: number;
	    paymentMethod: string;
	    cashGiven: number;
	    changeDue: number;
	    status: string;
	    isSynced: boolean;
	    createdAt: string;
	    syncedAt?: string;
	
	    static createFrom(source: any = {}) {
	        return new Order(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.orderNumber = source["orderNumber"];
	        this.outletId = source["outletId"];
	        this.customerName = source["customerName"];
	        this.items = this.convertValues(source["items"], OrderItem);
	        this.totalAmount = source["totalAmount"];
	        this.paymentMethod = source["paymentMethod"];
	        this.cashGiven = source["cashGiven"];
	        this.changeDue = source["changeDue"];
	        this.status = source["status"];
	        this.isSynced = source["isSynced"];
	        this.createdAt = source["createdAt"];
	        this.syncedAt = source["syncedAt"];
	    }
	
		convertValues(a: any, classs: any, asMap: boolean = false): any {
		    if (!a) {
		        return a;
		    }
		    if (a.slice && a.map) {
		        return (a as any[]).map(elem => this.convertValues(elem, classs));
		    } else if ("object" === typeof a) {
		        if (asMap) {
		            for (const key of Object.keys(a)) {
		                a[key] = new classs(a[key]);
		            }
		            return a;
		        }
		        return new classs(a);
		    }
		    return a;
		}
	}
	
	export class Product {
	    id: string;
	    name: string;
	    category: string;
	    price: number;
	    stock: number;
	    image: string;
	
	    static createFrom(source: any = {}) {
	        return new Product(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.id = source["id"];
	        this.name = source["name"];
	        this.category = source["category"];
	        this.price = source["price"];
	        this.stock = source["stock"];
	        this.image = source["image"];
	    }
	}
	export class SyncStatus {
	    isOnline: boolean;
	    pendingCount: number;
	    lastSyncAt: string;
	    serverUrl: string;
	
	    static createFrom(source: any = {}) {
	        return new SyncStatus(source);
	    }
	
	    constructor(source: any = {}) {
	        if ('string' === typeof source) source = JSON.parse(source);
	        this.isOnline = source["isOnline"];
	        this.pendingCount = source["pendingCount"];
	        this.lastSyncAt = source["lastSyncAt"];
	        this.serverUrl = source["serverUrl"];
	    }
	}

}

