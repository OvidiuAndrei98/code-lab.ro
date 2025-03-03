"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import GradientText from "@/components/animated-text/AnimatedText";
import { MailIcon, MapPin, PhoneIcon } from "lucide-react";
import React from "react";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(1, {
    message: "Name is required.",
  }),
  email: z.string().email({
    message: "Email is not valid.",
  }),
  message: z.string().min(1, {
    message: "Message is required.",
  }),
});

const Contact: React.FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  return (
    <div
      id="contact"
      className="w-full p-4 max-w-[1200px] mx-[auto] flex flex-col items-center gap-4 pt-[100px]"
    >
      <GradientText
        colors={["#4E26E2", "#953DF5", "#F501F5"]}
        animationSpeed={3}
        showBorder={false}
        className="text-center text-xl text-[#C8C8C8]"
      >
        Let's talk
      </GradientText>
      <h1 className="text-center text-white text-4xl font-bold mb-4">
        Contact
      </h1>
      <div className="flex flex-col gap-4 w-full md:flex-row md:justify-between">
        <div className="text-white space-y-4 pt-4 flex flex-col items-center md:items-start min-w-[250px]">
          <div className="flex gap-2 items-center">
            <MailIcon />
            contact@code-lab.ro
          </div>
          <div className="flex gap-2 items-center">
            <PhoneIcon />
            +40 741 488 739
          </div>
          <div className="flex gap-2 items-center">
            <MapPin />
            Intrarea Naruja Nr.1, Bucuresti
          </div>
        </div>
        <div className="w-full max-w-[570px] mx-auto md:mx-0">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8 flex flex-col"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#A4A4A4]">Name</FormLabel>
                    <FormControl>
                      <Input
                        className="text-white bg-[#1414149c] py-6 px-4 rounded-lg border-2 border-[#f3f3f310] border-transparent focus:border-2 focus:border-[#a476ff] placeholder:text-[#7D838B]"
                        placeholder="e.g. John Doe"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#A4A4A4]">Email</FormLabel>
                    <FormControl>
                      <Input
                        className="text-white bg-[#1414149c] py-6 px-4 rounded-lg border-2 border-[#f3f3f310] focus:border-2 focus:border-[#a476ff] placeholder:text-[#7D838B]"
                        placeholder="e.g. example@gmail.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#A4A4A4]">Message</FormLabel>
                    <FormControl>
                      <Textarea
                        className="text-white bg-[#1414149c] py-6 px-4 rounded-lg border-2 border-[#f3f3f310] focus:border-2 focus:border-[#a476ff] placeholder:text-[#7D838B]"
                        placeholder="e.g. I'd like to discuss a websiter for my company."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                className="bg-[#7231EC] hover:bg-[#5d16e0] text-md md:text-xl p-4 md:p-5 rounded-[8px] mt-8 md:mt-4 max-w-[200px] mx-auto md:mx-0"
                type="submit"
              >
                Submit
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
