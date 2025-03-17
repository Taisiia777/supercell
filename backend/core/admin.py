
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Role
from .models import ScheduledMailing

class CustomUserAdmin(UserAdmin):
    list_display = UserAdmin.list_display + ('get_roles',)
    filter_horizontal = ('roles',)
    
    def get_roles(self, obj):
        return ", ".join([role.name for role in obj.roles.all()])
    get_roles.short_description = 'Роли'

class RoleAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)
    list_filter = ('name',)



class ScheduledMailingAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'message', 
        'scheduled_time', 
        'is_sent', 
        'created_at'
    )
    list_filter = ('is_sent',)
    search_fields = ('message',)
    ordering = ('-scheduled_time',)


    
admin.site.register(ScheduledMailing, ScheduledMailingAdmin)
admin.site.register(User, CustomUserAdmin)
admin.site.register(Role, RoleAdmin)

