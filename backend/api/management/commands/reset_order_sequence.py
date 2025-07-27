from django.core.management.base import BaseCommand
from django.db import connection
from api.models import Order

class Command(BaseCommand):
    help = 'Resets the sequence for the Order model primary key.'

    def handle(self, *args, **kwargs):
        table_name = Order._meta.db_table  # Should return 'api_order'
        pk_column = Order._meta.pk.column  # Should return 'id'

        with connection.cursor() as cursor:
            sql = f"""
                SELECT setval(
                    pg_get_serial_sequence(%s, %s),
                    COALESCE((SELECT MAX({pk_column}) FROM {table_name}), 1),
                    true
                )
            """
            cursor.execute(sql, [table_name, pk_column])
            self.stdout.write(self.style.SUCCESS(f'Successfully reset sequence for {table_name}.{pk_column}'))
