package crypto

import (
	"crypto/rand"
	"io"
	"testing"
)

func TestEncryptDecrypt(t *testing.T) {
	key := make([]byte, 32)
	if _, err := io.ReadFull(rand.Reader, key); err != nil {
		t.Fatal(err)
	}

	plaintext := "my-super-secret-client-secret-12345!"

	ciphertext, err := Encrypt(key, plaintext)
	if err != nil {
		t.Fatalf("Encrypt failed: %v", err)
	}

	if ciphertext == plaintext {
		t.Fatal("ciphertext should not equal plaintext")
	}

	decrypted, err := Decrypt(key, ciphertext)
	if err != nil {
		t.Fatalf("Decrypt failed: %v", err)
	}

	if decrypted != plaintext {
		t.Fatalf("expected decrypted to be %q, got %q", plaintext, decrypted)
	}
}

func TestEncryptDecryptInvalidKey(t *testing.T) {
	invalidKey := []byte("short-key")
	plaintext := "hello"

	_, err := Encrypt(invalidKey, plaintext)
	if err == nil {
		t.Fatal("expected error with short key in Encrypt")
	}

	_, err = Decrypt(invalidKey, "some-ciphertext")
	if err == nil {
		t.Fatal("expected error with short key in Decrypt")
	}
}
