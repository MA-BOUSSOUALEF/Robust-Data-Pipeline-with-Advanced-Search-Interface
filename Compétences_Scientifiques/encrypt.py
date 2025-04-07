### author : kritet ilyas

from hashids import Hashids

hashids = Hashids(salt="my_secret_salt", min_length=20)

def encode_number(number: int) -> str:
    return hashids.encode(number)

def decode_hash(hash_string: str) -> int:
    decoded = hashids.decode(hash_string)
    return decoded[0] if decoded else None
 
