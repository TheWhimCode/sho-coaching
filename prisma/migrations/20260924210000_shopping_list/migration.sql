CREATE TABLE "admin"."ShoppingItem" (
    "id" TEXT NOT NULL,
    "groceryItemId" TEXT NOT NULL,
    "grams" DECIMAL(12,3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ShoppingItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShoppingItem_groceryItemId_key" ON "admin"."ShoppingItem"("groceryItemId");

ALTER TABLE "admin"."ShoppingItem" ADD CONSTRAINT "ShoppingItem_groceryItemId_fkey" FOREIGN KEY ("groceryItemId") REFERENCES "admin"."GroceryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
