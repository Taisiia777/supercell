// InputTest.tsx
import { forwardRef } from 'react';
import { FieldValues, UseFormRegister } from 'react-hook-form';
type InputProps = {
    name: string; // Используем имя поля для регистрации
    label: string;
    register: UseFormRegister<FieldValues>;
    required: boolean;
};

const InputTest = forwardRef<HTMLInputElement, InputProps>(({ name, label, register, required }, ref) => (
    <div>
        <label>{label}</label>
        <input {...register(name, { required })} name={name} ref={ref} />
    </div>
));

export default InputTest;
