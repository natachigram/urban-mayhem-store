# 🎮 Payment Integration Examples

## React Component Example

### Complete Buy Button with Payment Flow

```typescript
import { useState } from 'react';
import { usePayment } from '@/hooks/usePayment';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BuyButtonProps {
  itemId: string;
  itemName: string;
  price: number;
  playerId: string; // From your auth/session
}

export const BuyButton = ({ itemId, itemName, price, playerId }: BuyButtonProps) => {
  const { pay, isProcessing, walletAddress, checkBalance } = usePayment();
  const { toast } = useToast();
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handlePurchase = async () => {
    // 1. Check wallet connection
    if (!walletAddress) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your wallet to make a purchase',
        variant: 'destructive',
      });
      return;
    }

    // 2. Check balance (optional)
    const balance = await checkBalance();
    if (balance < price) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${price} TRUST tokens. Current balance: ${balance.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    // 3. Process payment
    setPurchaseStatus('idle');
    const result = await pay(itemId, playerId, price, 1);

    if (result.success) {
      setPurchaseStatus('success');
      
      // Show success notification
      toast({
        title: '🎉 Purchase Successful!',
        description: (
          <div className="space-y-2">
            <p className="font-bold">{itemName}</p>
            <p className="text-xs text-muted-foreground">
              Transaction: {result.transactionHash?.slice(0, 10)}...
              {result.transactionHash?.slice(-8)}
            </p>
            <p className="text-xs">Check your inventory in the game!</p>
          </div>
        ),
      });

      // Optional: Refresh inventory, redirect, etc.
      setTimeout(() => {
        window.location.href = '/history';
      }, 2000);
    } else {
      setPurchaseStatus('error');
    }
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePurchase}
        disabled={isProcessing || !walletAddress}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing Payment...
          </>
        ) : purchaseStatus === 'success' ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Purchased!
          </>
        ) : purchaseStatus === 'error' ? (
          <>
            <XCircle className="mr-2 h-4 w-4" />
            Try Again
          </>
        ) : (
          `Buy for ${price} TRUST`
        )}
      </Button>

      {!walletAddress && (
        <p className="text-xs text-muted-foreground text-center">
          Connect wallet to purchase
        </p>
      )}
    </div>
  );
};
```

---

## Unity C# Integration

### UrbanMayhemAPI.cs - Backend Communication

```csharp
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.Networking;

public class UrbanMayhemAPI : MonoBehaviour
{
    private const string API_BASE_URL = "https://your-project.supabase.co/functions/v1";
    private const string API_KEY = "your-anon-key";
    
    [System.Serializable]
    public class VerifyPaymentRequest
    {
        public string player_id;
        public string transaction_hash;
    }
    
    [System.Serializable]
    public class VerifyPaymentResponse
    {
        public bool success;
        public bool verified;
        public Purchase[] purchases;
        public string message;
    }
    
    [System.Serializable]
    public class Purchase
    {
        public string purchase_id;
        public string item_id;
        public string item_name;
        public int quantity;
        public float amount;
        public string transaction_hash;
        public string status;
        public string created_at;
    }
    
    [System.Serializable]
    public class InventoryResponse
    {
        public bool success;
        public InventoryItem[] inventory;
        public int count;
        public string message;
    }
    
    [System.Serializable]
    public class InventoryItem
    {
        public string item_id;
        public string item_name;
        public string item_type;
        public string item_rarity;
        public int quantity;
        public bool is_equipped;
        public string acquired_at;
    }
    
    /// <summary>
    /// Verify a purchase by player ID
    /// </summary>
    public IEnumerator VerifyPurchase(string playerId, Action<VerifyPaymentResponse> callback)
    {
        var request = new VerifyPaymentRequest { player_id = playerId };
        yield return PostJson("/verify-payment", request, callback);
    }
    
    /// <summary>
    /// Verify a specific transaction
    /// </summary>
    public IEnumerator VerifyTransaction(string playerId, string txHash, Action<VerifyPaymentResponse> callback)
    {
        var request = new VerifyPaymentRequest 
        { 
            player_id = playerId,
            transaction_hash = txHash 
        };
        yield return PostJson("/verify-payment", request, callback);
    }
    
    /// <summary>
    /// Get player inventory
    /// </summary>
    public IEnumerator GetInventory(string playerId, Action<InventoryResponse> callback)
    {
        var request = new { player_id = playerId };
        yield return PostJson("/get-player-inventory", request, callback);
    }
    
    private IEnumerator PostJson<T, R>(string endpoint, T requestData, Action<R> callback)
    {
        string url = API_BASE_URL + endpoint;
        string jsonData = JsonUtility.ToJson(requestData);
        
        using (UnityWebRequest www = UnityWebRequest.Post(url, jsonData, "application/json"))
        {
            www.SetRequestHeader("apikey", API_KEY);
            www.SetRequestHeader("Content-Type", "application/json");
            
            yield return www.SendWebRequest();
            
            if (www.result == UnityWebRequest.Result.Success)
            {
                string responseText = www.downloadHandler.text;
                R response = JsonUtility.FromJson<R>(responseText);
                callback?.Invoke(response);
            }
            else
            {
                Debug.LogError($"API Error: {www.error}");
                callback?.Invoke(default(R));
            }
        }
    }
}
```

### InventoryManager.cs - Sync Store Purchases

```csharp
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InventoryManager : MonoBehaviour
{
    public UrbanMayhemAPI api;
    public string playerId; // Set from player auth
    
    private List<UrbanMayhemAPI.InventoryItem> inventory = new List<UrbanMayhemAPI.InventoryItem>();
    
    void Start()
    {
        if (api == null)
            api = GetComponent<UrbanMayhemAPI>();
            
        SyncInventory();
    }
    
    /// <summary>
    /// Sync inventory from store backend
    /// </summary>
    public void SyncInventory()
    {
        StartCoroutine(api.GetInventory(playerId, OnInventoryReceived));
    }
    
    private void OnInventoryReceived(UrbanMayhemAPI.InventoryResponse response)
    {
        if (response.success)
        {
            inventory = new List<UrbanMayhemAPI.InventoryItem>(response.inventory);
            Debug.Log($"Inventory synced: {response.count} items");
            
            // Update UI
            UpdateInventoryUI();
            
            // Apply items to player
            ApplyOwnedItems();
        }
        else
        {
            Debug.LogError($"Failed to sync inventory: {response.message}");
        }
    }
    
    private void UpdateInventoryUI()
    {
        // Update your inventory UI panels here
        foreach (var item in inventory)
        {
            Debug.Log($"- {item.item_name} x{item.quantity} ({item.item_type})");
        }
    }
    
    private void ApplyOwnedItems()
    {
        // Example: Unlock skins, weapons, etc.
        foreach (var item in inventory)
        {
            switch (item.item_type)
            {
                case "weapon":
                    UnlockWeapon(item.item_id);
                    break;
                case "skin":
                    UnlockSkin(item.item_id);
                    break;
                case "powerup":
                    AddPowerup(item.item_id, item.quantity);
                    break;
            }
        }
    }
    
    private void UnlockWeapon(string weaponId)
    {
        Debug.Log($"Unlocked weapon: {weaponId}");
        // Your weapon unlock logic
    }
    
    private void UnlockSkin(string skinId)
    {
        Debug.Log($"Unlocked skin: {skinId}");
        // Your skin unlock logic
    }
    
    private void AddPowerup(string powerupId, int quantity)
    {
        Debug.Log($"Added powerup: {powerupId} x{quantity}");
        // Your powerup logic
    }
}
```

### PurchaseVerifier.cs - Verify After Web Purchase

```csharp
using System.Collections;
using UnityEngine;

public class PurchaseVerifier : MonoBehaviour
{
    public UrbanMayhemAPI api;
    public InventoryManager inventoryManager;
    public string playerId;
    
    void Start()
    {
        // Check for pending purchases when game starts
        CheckPendingPurchases();
    }
    
    /// <summary>
    /// Verify all purchases for this player
    /// Call this on game startup or after user visits web store
    /// </summary>
    public void CheckPendingPurchases()
    {
        StartCoroutine(api.VerifyPurchase(playerId, OnPurchasesVerified));
    }
    
    /// <summary>
    /// Verify a specific transaction
    /// Useful when user provides transaction hash
    /// </summary>
    public void VerifySpecificTransaction(string txHash)
    {
        StartCoroutine(api.VerifyTransaction(playerId, txHash, OnTransactionVerified));
    }
    
    private void OnPurchasesVerified(UrbanMayhemAPI.VerifyPaymentResponse response)
    {
        if (response.success && response.verified)
        {
            Debug.Log($"Found {response.purchases.Length} purchase(s)");
            
            foreach (var purchase in response.purchases)
            {
                ShowPurchaseNotification(purchase);
            }
            
            // Refresh inventory to get new items
            inventoryManager.SyncInventory();
        }
        else
        {
            Debug.Log("No new purchases found");
        }
    }
    
    private void OnTransactionVerified(UrbanMayhemAPI.VerifyPaymentResponse response)
    {
        if (response.success && response.verified)
        {
            Debug.Log("Transaction verified!");
            ShowPurchaseNotification(response.purchases[0]);
            inventoryManager.SyncInventory();
        }
        else
        {
            Debug.LogWarning("Transaction not found or not completed");
        }
    }
    
    private void ShowPurchaseNotification(UrbanMayhemAPI.Purchase purchase)
    {
        // Show in-game notification
        Debug.Log($"🎉 Purchase confirmed: {purchase.item_name} x{purchase.quantity}");
        
        // You can trigger UI notifications here
        // NotificationManager.Show($"Received: {purchase.item_name}");
    }
}
```

---

## Testing Workflow

### 1. Web Store Test

```typescript
// In browser console
const testPurchase = async () => {
  const { pay } = usePayment();
  
  const result = await pay(
    'item-uuid-here',
    'test_player_123',
    9.99,
    1
  );
  
  console.log('Result:', result);
};

testPurchase();
```

### 2. Unity Test

```csharp
// In Unity Editor, attach to a GameObject
public class TestPaymentSystem : MonoBehaviour
{
    public UrbanMayhemAPI api;
    
    [ContextMenu("Test Verify Purchase")]
    void TestVerify()
    {
        StartCoroutine(api.VerifyPurchase("test_player_123", response =>
        {
            Debug.Log($"Verified: {response.verified}");
            Debug.Log($"Purchases: {response.purchases.Length}");
        }));
    }
    
    [ContextMenu("Test Get Inventory")]
    void TestInventory()
    {
        StartCoroutine(api.GetInventory("test_player_123", response =>
        {
            Debug.Log($"Inventory Count: {response.count}");
            foreach (var item in response.inventory)
            {
                Debug.Log($"- {item.item_name}");
            }
        }));
    }
}
```

---

## Production Checklist

- [ ] `.env` configured with real Supabase credentials
- [ ] Database migrations applied
- [ ] Edge functions deployed
- [ ] $TRUST token contract address set
- [ ] Store wallet has receiving permissions
- [ ] Player ID generation system implemented
- [ ] Unity API integrated and tested
- [ ] Error handling and logging configured
- [ ] Transaction explorer links working
- [ ] Purchase notifications functional
- [ ] Inventory sync tested end-to-end
