# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import oscar.models.fields.autoslugfield
import django.db.models.deletion
import oscar.models.fields
from django.utils.module_loading import import_string
from django.conf import settings

models_AutoField = import_string(settings.DEFAULT_AUTO_FIELD)


class Migration(migrations.Migration):
    dependencies = [
        ("partner", "0001_initial"),
        ("customer", "0001_initial"),
        ("address", "0001_initial"),
        ("basket", "0002_auto_20140827_1705"),
        ("catalogue", "0001_initial"),
        ("sites", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BillingAddress",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        verbose_name="Title",
                        max_length=64,
                        blank=True,
                        choices=[
                            ("Mr", "Mr"),
                            ("Miss", "Miss"),
                            ("Mrs", "Mrs"),
                            ("Ms", "Ms"),
                            ("Dr", "Dr"),
                        ],
                    ),
                ),
                (
                    "first_name",
                    models.CharField(
                        max_length=255, verbose_name="First name", blank=True
                    ),
                ),
                (
                    "last_name",
                    models.CharField(
                        max_length=255, verbose_name="Last name", blank=True
                    ),
                ),
                (
                    "line1",
                    models.CharField(
                        max_length=255, verbose_name="First line of address"
                    ),
                ),
                (
                    "line2",
                    models.CharField(
                        max_length=255,
                        verbose_name="Second line of address",
                        blank=True,
                    ),
                ),
                (
                    "line3",
                    models.CharField(
                        max_length=255, verbose_name="Third line of address", blank=True
                    ),
                ),
                (
                    "line4",
                    models.CharField(max_length=255, verbose_name="City", blank=True),
                ),
                (
                    "state",
                    models.CharField(
                        max_length=255, verbose_name="State/County", blank=True
                    ),
                ),
                (
                    "postcode",
                    oscar.models.fields.UppercaseCharField(
                        max_length=64, verbose_name="Post/Zip-code", blank=True
                    ),
                ),
                (
                    "search_text",
                    models.TextField(
                        editable=False,
                        verbose_name="Search text - used only for searching addresses",
                    ),
                ),
                (
                    "country",
                    models.ForeignKey(
                        verbose_name="Country",
                        to="address.Country",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Billing addresses",
                "verbose_name": "Billing address",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="CommunicationEvent",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "date_created",
                    models.DateTimeField(auto_now_add=True, verbose_name="Date"),
                ),
                (
                    "event_type",
                    models.ForeignKey(
                        verbose_name="Event Type",
                        to="customer.CommunicationEventType",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_created"],
                "verbose_name_plural": "Communication Events",
                "verbose_name": "Communication Event",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="Line",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "partner_name",
                    models.CharField(
                        max_length=128, verbose_name="Partner name", blank=True
                    ),
                ),
                (
                    "partner_sku",
                    models.CharField(max_length=128, verbose_name="Partner SKU"),
                ),
                (
                    "partner_line_reference",
                    models.CharField(
                        verbose_name="Partner reference",
                        max_length=128,
                        help_text="This is the item number that the partner uses within their system",
                        blank=True,
                    ),
                ),
                (
                    "partner_line_notes",
                    models.TextField(verbose_name="Partner Notes", blank=True),
                ),
                ("title", models.CharField(max_length=255, verbose_name="Title")),
                (
                    "upc",
                    models.CharField(
                        verbose_name="UPC", max_length=128, blank=True, null=True
                    ),
                ),
                (
                    "quantity",
                    models.PositiveIntegerField(default=1, verbose_name="Quantity"),
                ),
                (
                    "line_price_incl_tax",
                    models.DecimalField(
                        max_digits=12, decimal_places=2, verbose_name="Price (inc. tax)"
                    ),
                ),
                (
                    "line_price_excl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Price (excl. tax)",
                    ),
                ),
                (
                    "line_price_before_discounts_incl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Price before discounts (inc. tax)",
                    ),
                ),
                (
                    "line_price_before_discounts_excl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Price before discounts (excl. tax)",
                    ),
                ),
                (
                    "unit_cost_price",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        blank=True,
                        verbose_name="Unit Cost Price",
                        null=True,
                    ),
                ),
                (
                    "unit_price_incl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        blank=True,
                        verbose_name="Unit Price (inc. tax)",
                        null=True,
                    ),
                ),
                (
                    "unit_price_excl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        blank=True,
                        verbose_name="Unit Price (excl. tax)",
                        null=True,
                    ),
                ),
                (
                    "unit_retail_price",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        blank=True,
                        verbose_name="Unit Retail Price",
                        null=True,
                    ),
                ),
                (
                    "status",
                    models.CharField(max_length=255, verbose_name="Status", blank=True),
                ),
                (
                    "est_dispatch_date",
                    models.DateField(
                        blank=True, verbose_name="Estimated Dispatch Date", null=True
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Order Lines",
                "verbose_name": "Order Line",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="LineAttribute",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("type", models.CharField(max_length=128, verbose_name="Type")),
                ("value", models.CharField(max_length=255, verbose_name="Value")),
                (
                    "line",
                    models.ForeignKey(
                        verbose_name="Line",
                        related_name="attributes",
                        to="order.Line",
                        on_delete=models.CASCADE,
                    ),
                ),
                (
                    "option",
                    models.ForeignKey(
                        verbose_name="Option",
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="line_attributes",
                        to="catalogue.Option",
                        null=True,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Line Attributes",
                "verbose_name": "Line Attribute",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="LinePrice",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "quantity",
                    models.PositiveIntegerField(default=1, verbose_name="Quantity"),
                ),
                (
                    "price_incl_tax",
                    models.DecimalField(
                        max_digits=12, decimal_places=2, verbose_name="Price (inc. tax)"
                    ),
                ),
                (
                    "price_excl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Price (excl. tax)",
                    ),
                ),
                (
                    "shipping_incl_tax",
                    models.DecimalField(
                        default=0,
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Shiping (inc. tax)",
                    ),
                ),
                (
                    "shipping_excl_tax",
                    models.DecimalField(
                        default=0,
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Shipping (excl. tax)",
                    ),
                ),
                (
                    "line",
                    models.ForeignKey(
                        verbose_name="Line",
                        related_name="prices",
                        to="order.Line",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "ordering": ("id",),
                "verbose_name_plural": "Line Prices",
                "verbose_name": "Line Price",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="Order",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "number",
                    models.CharField(
                        max_length=128,
                        unique=True,
                        db_index=True,
                        verbose_name="Order number",
                    ),
                ),
                (
                    "currency",
                    models.CharField(
                        default="GBP", max_length=12, verbose_name="Currency"
                    ),
                ),
                (
                    "total_incl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Order total (inc. tax)",
                    ),
                ),
                (
                    "total_excl_tax",
                    models.DecimalField(
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Order total (excl. tax)",
                    ),
                ),
                (
                    "shipping_incl_tax",
                    models.DecimalField(
                        default=0,
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Shipping charge (inc. tax)",
                    ),
                ),
                (
                    "shipping_excl_tax",
                    models.DecimalField(
                        default=0,
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Shipping charge (excl. tax)",
                    ),
                ),
                (
                    "shipping_method",
                    models.CharField(
                        max_length=128, verbose_name="Shipping method", blank=True
                    ),
                ),
                (
                    "shipping_code",
                    models.CharField(default="", max_length=128, blank=True),
                ),
                (
                    "status",
                    models.CharField(max_length=100, verbose_name="Status", blank=True),
                ),
                (
                    "guest_email",
                    models.EmailField(
                        max_length=75, verbose_name="Guest email address", blank=True
                    ),
                ),
                ("date_placed", models.DateTimeField(auto_now_add=True, db_index=True)),
                (
                    "basket",
                    models.ForeignKey(
                        null=True,
                        verbose_name="Basket",
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="basket.Basket",
                        blank=True,
                    ),
                ),
                (
                    "billing_address",
                    models.ForeignKey(
                        null=True,
                        verbose_name="Billing Address",
                        on_delete=django.db.models.deletion.SET_NULL,
                        to="order.BillingAddress",
                        blank=True,
                    ),
                ),
            ],
            options={
                "ordering": ["-date_placed"],
                "verbose_name_plural": "Orders",
                "verbose_name": "Order",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="OrderDiscount",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "category",
                    models.CharField(
                        default="Basket",
                        max_length=64,
                        verbose_name="Discount category",
                        choices=[
                            ("Basket", "Basket"),
                            ("Shipping", "Shipping"),
                            ("Deferred", "Deferred"),
                        ],
                    ),
                ),
                (
                    "offer_id",
                    models.PositiveIntegerField(
                        blank=True, verbose_name="Offer ID", null=True
                    ),
                ),
                (
                    "offer_name",
                    models.CharField(
                        max_length=128,
                        db_index=True,
                        verbose_name="Offer name",
                        blank=True,
                    ),
                ),
                (
                    "voucher_id",
                    models.PositiveIntegerField(
                        blank=True, verbose_name="Voucher ID", null=True
                    ),
                ),
                (
                    "voucher_code",
                    models.CharField(
                        max_length=128, db_index=True, verbose_name="Code", blank=True
                    ),
                ),
                (
                    "frequency",
                    models.PositiveIntegerField(verbose_name="Frequency", null=True),
                ),
                (
                    "amount",
                    models.DecimalField(
                        default=0,
                        max_digits=12,
                        decimal_places=2,
                        verbose_name="Amount",
                    ),
                ),
                ("message", models.TextField(blank=True)),
                (
                    "order",
                    models.ForeignKey(
                        verbose_name="Order",
                        related_name="discounts",
                        to="order.Order",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Order Discounts",
                "verbose_name": "Order Discount",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="OrderNote",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "note_type",
                    models.CharField(
                        max_length=128, verbose_name="Note Type", blank=True
                    ),
                ),
                ("message", models.TextField(verbose_name="Message")),
                (
                    "date_created",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Date Created"
                    ),
                ),
                (
                    "date_updated",
                    models.DateTimeField(auto_now=True, verbose_name="Date Updated"),
                ),
                (
                    "order",
                    models.ForeignKey(
                        verbose_name="Order",
                        related_name="notes",
                        to="order.Order",
                        on_delete=models.CASCADE,
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        verbose_name="User",
                        to=settings.AUTH_USER_MODEL,
                        null=True,
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Order Notes",
                "verbose_name": "Order Note",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="PaymentEvent",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "amount",
                    models.DecimalField(
                        max_digits=12, decimal_places=2, verbose_name="Amount"
                    ),
                ),
                (
                    "reference",
                    models.CharField(
                        max_length=128, verbose_name="Reference", blank=True
                    ),
                ),
                (
                    "date_created",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Date created"
                    ),
                ),
            ],
            options={
                "ordering": ["-date_created"],
                "verbose_name_plural": "Payment Events",
                "verbose_name": "Payment Event",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="PaymentEventQuantity",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("quantity", models.PositiveIntegerField(verbose_name="Quantity")),
                (
                    "event",
                    models.ForeignKey(
                        verbose_name="Event",
                        related_name="line_quantities",
                        to="order.PaymentEvent",
                        on_delete=models.CASCADE,
                    ),
                ),
                (
                    "line",
                    models.ForeignKey(
                        verbose_name="Line",
                        related_name="payment_event_quantities",
                        to="order.Line",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Payment Event Quantities",
                "verbose_name": "Payment Event Quantity",
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="PaymentEventType",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(unique=True, max_length=128, verbose_name="Name"),
                ),
                (
                    "code",
                    oscar.models.fields.autoslugfield.AutoSlugField(
                        populate_from="name",
                        unique=True,
                        verbose_name="Code",
                        max_length=128,
                        editable=False,
                        blank=True,
                    ),
                ),
            ],
            options={
                "ordering": ("name",),
                "verbose_name_plural": "Payment Event Types",
                "verbose_name": "Payment Event Type",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="ShippingAddress",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "title",
                    models.CharField(
                        verbose_name="Title",
                        max_length=64,
                        blank=True,
                        choices=[
                            ("Mr", "Mr"),
                            ("Miss", "Miss"),
                            ("Mrs", "Mrs"),
                            ("Ms", "Ms"),
                            ("Dr", "Dr"),
                        ],
                    ),
                ),
                (
                    "first_name",
                    models.CharField(
                        max_length=255, verbose_name="First name", blank=True
                    ),
                ),
                (
                    "last_name",
                    models.CharField(
                        max_length=255, verbose_name="Last name", blank=True
                    ),
                ),
                (
                    "line1",
                    models.CharField(
                        max_length=255, verbose_name="First line of address"
                    ),
                ),
                (
                    "line2",
                    models.CharField(
                        max_length=255,
                        verbose_name="Second line of address",
                        blank=True,
                    ),
                ),
                (
                    "line3",
                    models.CharField(
                        max_length=255, verbose_name="Third line of address", blank=True
                    ),
                ),
                (
                    "line4",
                    models.CharField(max_length=255, verbose_name="City", blank=True),
                ),
                (
                    "state",
                    models.CharField(
                        max_length=255, verbose_name="State/County", blank=True
                    ),
                ),
                (
                    "postcode",
                    oscar.models.fields.UppercaseCharField(
                        max_length=64, verbose_name="Post/Zip-code", blank=True
                    ),
                ),
                (
                    "search_text",
                    models.TextField(
                        editable=False,
                        verbose_name="Search text - used only for searching addresses",
                    ),
                ),
                (
                    "phone_number",
                    oscar.models.fields.PhoneNumberField(
                        verbose_name="Phone number",
                        help_text="In case we need to call you about your order",
                        blank=True,
                    ),
                ),
                (
                    "notes",
                    models.TextField(
                        verbose_name="Instructions",
                        help_text="Tell us anything we should know when delivering your order.",
                        blank=True,
                    ),
                ),
                (
                    "country",
                    models.ForeignKey(
                        verbose_name="Country",
                        to="address.Country",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Shipping addresses",
                "verbose_name": "Shipping address",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="ShippingEvent",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "notes",
                    models.TextField(
                        verbose_name="Event notes",
                        help_text="This could be the dispatch reference, or a tracking number",
                        blank=True,
                    ),
                ),
                (
                    "date_created",
                    models.DateTimeField(
                        auto_now_add=True, verbose_name="Date Created"
                    ),
                ),
            ],
            options={
                "ordering": ["-date_created"],
                "verbose_name_plural": "Shipping Events",
                "verbose_name": "Shipping Event",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="ShippingEventQuantity",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("quantity", models.PositiveIntegerField(verbose_name="Quantity")),
                (
                    "event",
                    models.ForeignKey(
                        verbose_name="Event",
                        related_name="line_quantities",
                        to="order.ShippingEvent",
                        on_delete=models.CASCADE,
                    ),
                ),
                (
                    "line",
                    models.ForeignKey(
                        verbose_name="Line",
                        related_name="shipping_event_quantities",
                        to="order.Line",
                        on_delete=models.CASCADE,
                    ),
                ),
            ],
            options={
                "verbose_name_plural": "Shipping Event Quantities",
                "verbose_name": "Shipping Event Quantity",
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name="ShippingEventType",
            fields=[
                (
                    "id",
                    models_AutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                (
                    "name",
                    models.CharField(unique=True, max_length=255, verbose_name="Name"),
                ),
                (
                    "code",
                    oscar.models.fields.autoslugfield.AutoSlugField(
                        populate_from="name",
                        unique=True,
                        verbose_name="Code",
                        max_length=128,
                        editable=False,
                        blank=True,
                    ),
                ),
            ],
            options={
                "ordering": ("name",),
                "verbose_name_plural": "Shipping Event Types",
                "verbose_name": "Shipping Event Type",
                "abstract": False,
            },
            bases=(models.Model,),
        ),
        migrations.AlterUniqueTogether(
            name="shippingeventquantity",
            unique_together=set([("event", "line")]),
        ),
        migrations.AddField(
            model_name="shippingevent",
            name="event_type",
            field=models.ForeignKey(
                verbose_name="Event Type",
                to="order.ShippingEventType",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="shippingevent",
            name="lines",
            field=models.ManyToManyField(
                related_name="shipping_events",
                verbose_name="Lines",
                to="order.Line",
                through="order.ShippingEventQuantity",
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="shippingevent",
            name="order",
            field=models.ForeignKey(
                verbose_name="Order",
                related_name="shipping_events",
                to="order.Order",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AlterUniqueTogether(
            name="paymenteventquantity",
            unique_together=set([("event", "line")]),
        ),
        migrations.AddField(
            model_name="paymentevent",
            name="event_type",
            field=models.ForeignKey(
                verbose_name="Event Type",
                to="order.PaymentEventType",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="paymentevent",
            name="lines",
            field=models.ManyToManyField(
                through="order.PaymentEventQuantity",
                verbose_name="Lines",
                to="order.Line",
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="paymentevent",
            name="order",
            field=models.ForeignKey(
                verbose_name="Order",
                related_name="payment_events",
                to="order.Order",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="paymentevent",
            name="shipping_event",
            field=models.ForeignKey(
                related_name="payment_events",
                to="order.ShippingEvent",
                null=True,
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="order",
            name="shipping_address",
            field=models.ForeignKey(
                null=True,
                verbose_name="Shipping Address",
                on_delete=django.db.models.deletion.SET_NULL,
                to="order.ShippingAddress",
                blank=True,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="order",
            name="site",
            field=models.ForeignKey(
                verbose_name="Site",
                on_delete=django.db.models.deletion.SET_NULL,
                to="sites.Site",
                null=True,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="order",
            name="user",
            field=models.ForeignKey(
                null=True,
                verbose_name="User",
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="orders",
                to=settings.AUTH_USER_MODEL,
                blank=True,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="lineprice",
            name="order",
            field=models.ForeignKey(
                verbose_name="Option",
                related_name="line_prices",
                to="order.Order",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="line",
            name="order",
            field=models.ForeignKey(
                verbose_name="Order",
                related_name="lines",
                to="order.Order",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="line",
            name="partner",
            field=models.ForeignKey(
                null=True,
                verbose_name="Partner",
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="order_lines",
                to="partner.Partner",
                blank=True,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="line",
            name="product",
            field=models.ForeignKey(
                null=True,
                verbose_name="Product",
                on_delete=django.db.models.deletion.SET_NULL,
                to="catalogue.Product",
                blank=True,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="line",
            name="stockrecord",
            field=models.ForeignKey(
                null=True,
                verbose_name="Stock record",
                on_delete=django.db.models.deletion.SET_NULL,
                to="partner.StockRecord",
                blank=True,
            ),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name="communicationevent",
            name="order",
            field=models.ForeignKey(
                verbose_name="Order",
                related_name="communication_events",
                to="order.Order",
                on_delete=models.CASCADE,
            ),
            preserve_default=True,
        ),
    ]
