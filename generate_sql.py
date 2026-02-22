import csv
import os
import re
from datetime import datetime

base_dir = '/Users/ihyeong-won/Downloads/Private & Shared 4/26 01 26'
history_file = '/Users/ihyeong-won/Downloads/Private & Shared 3/자산관리 형원 20952f6c484e8060ac78d705d6f6b7e3_all.csv'

output_file = 'migration.sql'

category_files = {
    'STOCK': '증권 2f452f6c484e805db9bee13d08819a0b.csv',
    'SAVINGS': '예금 2f452f6c484e80a6afa0f63b7c9fba8a.csv',
    'INSTALLMENT': '적금 2f452f6c484e80df87cec48069c3be04.csv',
    'CRYPTO': '가상자산 2f452f6c484e80e4a269f802e287aa14.csv',
    'REAL_ESTATE': '부동산 2f452f6c484e80c89db3ee36d00df619.csv',
    'DEBT': '채무 2f452f6c484e805aa7a0cb47594e9cf1.csv',
    'OTHER': '기타 2f452f6c484e80debbe5fc7054d305cb.csv'
}

def parse_amount(amt_str):
    if not amt_str:
        return 0
    # remove special chars ₩, ,, space
    cln = re.sub(r'[^\d\-]', '', amt_str)
    return int(cln) if cln else 0

def parse_date(date_str):
    date_str = date_str.strip()
    if not date_str:
        return None
    try:
        # 25/06/07
        dt = datetime.strptime(date_str, '%y/%m/%d')
        return dt.strftime('%Y-%m-%d')
    except:
        return None

with open(output_file, 'w', encoding='utf-8') as out:
    out.write("-- Migration Script for Neon DB\n\n")
    
    # 1. Parse Asset History
    out.write("-- 1. Asset History\n")
    if os.path.exists(history_file):
        with open(history_file, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            next(reader) # skip header
            for row in reader:
                if len(row) >= 3:
                    date_raw = row[0]
                    amount_raw = row[2]
                    amt = parse_amount(amount_raw)
                    dt = parse_date(date_raw)
                    if dt and amt != 0:
                        out.write(f"INSERT INTO asset_history (total_amount, recorded_date) VALUES ({amt}, '{dt}');\n")
    
    out.write("\n-- 2. Assets and Asset Item History\n")
    
    asset_id_counter = 1
    today_dt = '2026-01-26'
    
    for category, filename in category_files.items():
        filepath = os.path.join(base_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader) # skip header
                for row in reader:
                    if len(row) >= 2:
                        name = row[0].strip()
                        if not name: continue
                        amount = parse_amount(row[1])
                        desc = ""
                        if len(row) >= 3:
                            desc = row[2].strip().replace("'", "''") # escape single quote
                        
                        # Debt is stored as negative or positive? The CSV had positive amounts for some, let's keep it as is from parse_amount, but maybe ensure debt is negative?
                        # Wait, the user's Debt CSV has positive amounts for debt (e.g., 200,000,000). The `_all` has `-₩363,398,000`. So I should probably make DEBT negative.
                        if category == 'DEBT' and amount > 0:
                            amount = -amount

                        platform = ""
                        # Try to guess platform for some names
                        if "증권" in name or "은행" in name or "토스" in name:
                            platform = name.split("-")[0] if "-" in name else name

                        # Insert Asset
                        # Fields: id, name, amount, previous_amount, category, platform, description, created_at
                        out.write(f"INSERT INTO asset (id, name, amount, previous_amount, category, platform, description, created_at) ")
                        out.write(f"VALUES ({asset_id_counter}, '{name}', {amount}, 0, '{category}', '{platform}', '{desc}', '{today_dt} 00:00:00');\n")
                        
                        # Insert AssetItemHistory
                        out.write(f"INSERT INTO asset_item_history (asset_id, amount, recorded_date) ")
                        out.write(f"VALUES ({asset_id_counter}, {amount}, '{today_dt}');\n")
                        
                        asset_id_counter += 1

print(f"Generated {output_file} successfully.")
